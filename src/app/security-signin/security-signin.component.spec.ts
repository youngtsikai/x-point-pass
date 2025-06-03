import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecuritySigninComponent } from './security-signin.component';

describe('SecuritySigninComponent', () => {
  let component: SecuritySigninComponent;
  let fixture: ComponentFixture<SecuritySigninComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecuritySigninComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecuritySigninComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
