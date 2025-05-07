import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorProfileComponent } from './visitor-profile.component';

describe('VisitorProfileComponent', () => {
  let component: VisitorProfileComponent;
  let fixture: ComponentFixture<VisitorProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorProfileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisitorProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
