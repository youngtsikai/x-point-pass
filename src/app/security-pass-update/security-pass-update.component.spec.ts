import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityPassUpdateComponent } from './security-pass-update.component';

describe('SecurityPassUpdateComponent', () => {
  let component: SecurityPassUpdateComponent;
  let fixture: ComponentFixture<SecurityPassUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityPassUpdateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityPassUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
